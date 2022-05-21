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

export class AwsIoCCdkDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'ProdTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'ProductTable',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const funcProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'],
      },
    };

    const prodGetFn = new NodejsFunction(this, 'prodGetFn', {
      ...funcProps,
      entry: join(__dirname, '..', 'src', 'product', 'get.js'),
    });

    const prodPostFn = new NodejsFunction(this, 'prodPostFn', {
      ...funcProps,
      entry: join(__dirname, '..', 'src', 'product', 'post.js'),
    });

    table.grantReadWriteData(prodGetFn);
    table.grantReadWriteData(prodPostFn);

    const apiGW = new RestApi(this, 'shoppingApi');
    const apiGWProd = apiGW.root.addResource('product');

    const integrationResponse: IntegrationResponse = {
      statusCode: '200',
    };
    const methodResponse: MethodResponse = {
      statusCode: '200',
    };

    const prodGetIntergration = new LambdaIntegration(prodGetFn, {
      proxy: false,
      integrationResponses: [integrationResponse],
    });
    apiGWProd.addMethod('GET', prodGetIntergration, {
      methodResponses: [methodResponse],
    });

    const prodPostIntergration = new LambdaIntegration(prodPostFn, {
      proxy: false,
      integrationResponses: [integrationResponse],
    });
    apiGWProd.addMethod('POST', prodPostIntergration, {
      methodResponses: [methodResponse],
    });
  }
}
