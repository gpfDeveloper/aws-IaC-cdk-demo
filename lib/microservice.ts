import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

interface PfMicroserviceProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}

export default class PfMicroservice extends Construct {
  public readonly productMicroservice: NodejsFunction;
  public readonly basketMicroservice: NodejsFunction;
  public readonly orderMicroservice: NodejsFunction;

  private commonProps: NodejsFunctionProps = {
    bundling: {
      externalModules: ['aws-sdk'],
    },
    runtime: Runtime.NODEJS_16_X,
  };

  constructor(scope: Construct, id: string, props: PfMicroserviceProps) {
    super(scope, id);
    this.productMicroservice = this.createProductMicroservice(
      props.productTable
    );
    this.basketMicroservice = this.createBasketMicroservice(props.basketTable);
    this.orderMicroservice = this.createOrderMicroservice(props.orderTable);
  }

  private createProductMicroservice(productTable: ITable): NodejsFunction {
    const fn = new NodejsFunction(this, 'productLambdaFn', {
      ...this.commonProps,
      environment: {
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      entry: join(__dirname, '..', 'src', 'product', 'index.js'),
    });
    productTable.grantReadWriteData(fn);
    return fn;
  }

  private createBasketMicroservice(basketTable: ITable): NodejsFunction {
    const fn = new NodejsFunction(this, 'basketLambdaFn', {
      ...this.commonProps,
      environment: {
        DYNAMODB_TABLE_NAME: basketTable.tableName,
      },
      entry: join(__dirname, '..', 'src', 'basket', 'index.js'),
    });
    basketTable.grantReadWriteData(fn);
    return fn;
  }

  private createOrderMicroservice(orderTable: ITable): NodejsFunction {
    const fn = new NodejsFunction(this, 'orderLambdaFn', {
      ...this.commonProps,
      environment: {
        DYNAMODB_TABLE_NAME: orderTable.tableName,
        EVENT_BUS_NAME: 'PfEventBus',
        EVENT_BUS_SOURCE: 'com.pf.bascket.checkoutbasket',
        EVENT_BUS_DETAIL_TYPE: 'checkoutBasket',
      },
      entry: join(__dirname, '..', 'src', 'order', 'index.js'),
    });
    orderTable.grantReadWriteData(fn);
    return fn;
  }
}
