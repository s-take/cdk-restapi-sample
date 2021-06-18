import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB
    const table = new dynamodb.Table(this, "items", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "take-sampleapi-users",
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    // add local secondary index
    // table.addLocalSecondaryIndex({
    //   indexName: 'statusIndex',
    //   sortKey: {name: 'status', type: dynamodb.AttributeType.STRING},
    //   projectionType: dynamodb.ProjectionType.ALL,
    // });

    // Lambda function
    const asset = lambda.Code.fromAsset(__dirname, {
      bundling: {
        image: lambda.Runtime.NODEJS_14_X.bundlingDockerImage,
        // image: lambda.Runtime.NODEJS_14_X.bundlingImage,
        user: "root",
        command: ["bash", "build.sh"],
      },
    });

    const apiHandler = new lambda.Function(this, "apiHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "lambda/main.handler",
      code: asset,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    table.grantReadWriteData(apiHandler);

    // APIGateway
    const apiRoot = new apigateway.LambdaRestApi(this, "take-sampleapi-cdk", {
      handler: apiHandler,
      proxy: false,
      cloudWatchRole: false,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["execute-api:Invoke"],
            resources: ["execute-api:/*/*"],
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
          }),
        ],
      }),
    });
    // message
    const v1 = apiRoot.root.addResource("api").addResource("v1");
    const repository = v1.addResource("message");
    repository.addMethod("GET");
    // users
    const users = apiRoot.root.addResource("users");
    users.addResource("{lineId}").addMethod("GET");
    users.addMethod("POST");
  }
}
