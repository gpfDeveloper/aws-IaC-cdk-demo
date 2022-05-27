import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import PfApiGateway from './apigateway';
import PfDatabase from './database';
import PfEventBus from './eventbus';
import PfMicroservice from './microservice';
import PfQueue from './queue';

export class AwsIoCCdkDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new PfDatabase(this, 'PfDatebase');
    const microservice = new PfMicroservice(this, 'PfMicroservice', {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable,
    });
    const apiGateway = new PfApiGateway(this, 'PfApigateway', {
      productMicroservice: microservice.productMicroservice,
      basketMicroservice: microservice.basketMicroservice,
      orderMicroservice: microservice.orderMicroservice,
    });
    const queue = new PfQueue(this, 'PfQueue', {
      orderQueueConsumer: microservice.orderMicroservice,
    });
    const eventBus = new PfEventBus(this, 'PfEventBus', {
      basketCheckoutService: microservice.basketMicroservice,
      orderQueue: queue.orderQueue,
    });
  }
}
