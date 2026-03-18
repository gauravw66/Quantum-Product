require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const ibmService = require('./services/ibmQuantumService');
const prisma = new PrismaClient();

(async () => {
  const account = await prisma.quantumAccount.findFirst({ orderBy: { createdAt: 'desc' } });
  const targets = ['Deutsch-Jozsa Algorithm', 'Bit Flip Code'];

  for (const name of targets) {
    const module = await prisma.module.findFirst({ where: { name } });
    if (!module) {
      console.log('missing_module', name);
      continue;
    }

    const submitted = await ibmService.runJob(account.token, module.qiskitCodeTemplate, 'ibm_fez', account.instance);
    console.log('submitted', name, submitted.ibmJobId);

    let finalStatus = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const status = await ibmService.getJobStatus(account.token, submitted.ibmJobId);
      const s = String(status || '').toUpperCase();
      console.log('poll', name, i + 1, status);
      if (['COMPLETED', 'FAILED', 'CANCELLED', 'ERROR'].includes(s)) {
        finalStatus = s;
        break;
      }
    }

    if (finalStatus === 'FAILED' || finalStatus === 'ERROR') {
      try {
        const raw = await ibmService.getRawJobInfo(account.token, submitted.ibmJobId);
        console.log('fail_info', name, JSON.stringify(raw).slice(0, 400));
      } catch (e) {
        console.log('fail_info_error', name, e.message);
      }
    }

    console.log('final', name, finalStatus || 'TIMEOUT');
  }

  await prisma.$disconnect();
})();
