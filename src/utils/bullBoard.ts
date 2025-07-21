import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ENV, ENVIRONMENTS } from '../config/superChain/constants';
import { attestQueueService } from '@/services/badges/queue/attestQueue.service';


export const setupBullBoard = (app: any) => {

  if (ENV === ENVIRONMENTS.production) {
    return;
  }

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
 
  const queueAdapters = [
    new BullMQAdapter(attestQueueService.queue),
  ];
  createBullBoard({
    queues: queueAdapters,
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
};
