import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
    const v1 = apiRoot.root.addResource("api").addResource("v1");
    // message
    const repository = v1.addResource("message");
    repository.addMethod("GET");
  }
}
