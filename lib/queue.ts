import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface PfQueueProps {
  orderQueueConsumer: IFunction;
}
export default class PfQueue extends Construct {
  public readonly orderQueue: IQueue;

  constructor(scope: Construct, id: string, props: PfQueueProps) {
    super(scope, id);
    this.orderQueue = this.createOrderQueue(props.orderQueueConsumer);
  }

  private createOrderQueue(orderQueueConsumer: IFunction): IQueue {
    const queue = new Queue(this, 'orderQueue');
    orderQueueConsumer.addEventSource(
      new SqsEventSource(queue, { batchSize: 1 })
    );
    return queue;
  }
}
