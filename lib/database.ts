import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export default class PfDatabase extends Construct {
  public readonly productTable: ITable;
  public readonly basketTable: ITable;
  public readonly orderTable: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.productTable = this.createProductTable();
    this.basketTable = this.createBasketTable();
    this.orderTable = this.createOrderTable();
  }

  private createProductTable(): ITable {
    return new Table(this, 'ProductTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'Product',
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private createBasketTable(): ITable {
    return new Table(this, 'BasketTable', {
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      tableName: 'Basket',
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private createOrderTable(): ITable {
    return new Table(this, 'OrderTable', {
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'orderDate', type: AttributeType.STRING },
      tableName: 'Order',
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
