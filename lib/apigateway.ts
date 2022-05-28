import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface PfApiGatewayProps {
  productMicroservice: IFunction;
  basketMicroservice: IFunction;
  orderMicroservice: IFunction;
}

export default class PfApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: PfApiGatewayProps) {
    super(scope, id);
    this.createProductApi(props.productMicroservice);
    this.createBasketApi(props.basketMicroservice);
    this.createOrderApi(props.orderMicroservice);
  }

  private createProductApi(productMicroservice: IFunction): void {
    const api = new LambdaRestApi(this, 'product', {
      handler: productMicroservice,
      proxy: false,
    });
    const productApi = api.root.addResource('product');
    productApi.addMethod('GET');
    productApi.addMethod('POST');
    const singleProduct = productApi.addResource('{id}');
    singleProduct.addMethod('GET');
    singleProduct.addMethod('PUT');
    singleProduct.addMethod('DELETE');
  }

  private createBasketApi(basketMicroservice: IFunction): void {
    const api = new LambdaRestApi(this, 'basket', {
      handler: basketMicroservice,
      proxy: false,
    });
    const basketApi = api.root.addResource('basket');
    basketApi.addMethod('GET');
    basketApi.addMethod('POST');
    const basketCheckout = basketApi.addResource('checkout');
    basketCheckout.addMethod('POST');
    const singleBasket = basketApi.addResource('{userId}');
    singleBasket.addMethod('GET');
    singleBasket.addMethod('DELETE');
  }

  private createOrderApi(orderMicroservice: IFunction): void {
    const api = new LambdaRestApi(this, 'order', {
      handler: orderMicroservice,
      proxy: false,
    });
    const orderApi = api.root.addResource('order');
    orderApi.addMethod('GET');
    const singleOrder = orderApi.addResource('{userId}');
    singleOrder.addMethod('GET');
  }
}
