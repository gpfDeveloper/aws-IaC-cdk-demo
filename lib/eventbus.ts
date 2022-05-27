import { EventBus, IEventBus, Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface PfEventBusProps {
  basketCheckoutService: IFunction;
  orderQueue: IQueue;
}

export default class PfEventBus extends Construct {
  private eventBus: IEventBus;

  constructor(scope: Construct, id: string, props: PfEventBusProps) {
    super(scope, id);
    this.eventBus = new EventBus(this, 'PfEventBus', {
      eventBusName: 'PfEventBus',
    });
    this.eventBus.grantPutEventsTo(props.basketCheckoutService);
    this.createBasketCheckoutEventRule(props.orderQueue);
  }

  private createBasketCheckoutEventRule(orderQueue: IQueue): void {
    const rule = new Rule(this, 'basketCheckoutRule', {
      description: 'Checkout basket rule.',
      eventBus: this.eventBus,
      eventPattern: {
        detailType: ['checkoutBasket'],
        source: ['com.pf.bascket.checkoutbasket'],
      },
    });
    rule.addTarget(new SqsQueue(orderQueue));
  }
}
