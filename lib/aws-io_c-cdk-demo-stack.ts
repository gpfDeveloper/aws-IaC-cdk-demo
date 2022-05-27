import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  IntegrationResponse,
  LambdaIntegration,
  MethodResponse,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
import PfApiGateway from './apigateway';
import PfDatabase from './database';
import PfMicroservice from './microservice';

export class AwsIoCCdkDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new PfDatabase(this, 'Datebase');
    const microservice = new PfMicroservice(this, 'microservice', {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable,
    });
    const apiGateway = new PfApiGateway(this, 'apigateway', {
      productMicroservice: microservice.productMicroservice,
      basketMicroservice: microservice.basketMicroservice,
      orderMicroservice: microservice.orderMicroservice,
    });

    // const apiGW = new RestApi(this, 'shoppingApi');
    // const apiGWProd = apiGW.root.addResource('product');

    // const integrationResponse: IntegrationResponse = {
    //   statusCode: '200',
    // };
    // const methodResponse: MethodResponse = {
    //   statusCode: '200',
    // };

    // const prodGetIntergration = new LambdaIntegration(prodGetFn, {
    //   proxy: false,
    //   integrationResponses: [integrationResponse],
    // });
    // apiGWProd.addMethod('GET', prodGetIntergration, {
    //   methodResponses: [methodResponse],
    // });

    // const prodPostIntergration = new LambdaIntegration(prodPostFn, {
    //   proxy: false,
    //   integrationResponses: [integrationResponse],
    // });
    // apiGWProd.addMethod('POST', prodPostIntergration, {
    //   methodResponses: [methodResponse],
    // });
  }
}
