const { Stack, Duration, aws_s3, aws_lambda, aws_iam } = require('aws-cdk-lib');
const cdk = require('aws-cdk-lib')

class BedrockCdkStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    const bucket = new aws_s3.Bucket(this, 'moviePosterDesignStoreS3Bucket',{
      bucketName:'movieposterdesignstorebucket'
    });
    const bedrockAccessPolicy = new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      actions: [
        "bedrock:*",
      ],
      resources: ["*"],
    })
    const bedrockLambda = new aws_lambda.Function(this,'bedrockLambda',{
      functionName:"moviePosterDesignFunction",
      runtime:aws_lambda.Runtime.PYTHON_3_11,
      code:aws_lambda.Code.fromAsset('src/'),
      handler:"bedrockhandler.handler",
      timeout:cdk.Duration.minutes(1)
    })
    const api = new cdk.aws_apigateway.RestApi(this,"bedrockMovieAPI",{
      defaultCorsPreflightOptions:{
        allowOrigins:cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowHeaders:['Content-Type','X-Amz-Date','Authorization','X-Api-Key','X-Amz-Security-Token','X-Amz-User-Agent','ic-auth']
      }
    })
    api.addGatewayResponse("test-response", {
      type: cdk.aws_apigateway.ResponseType.UNAUTHORIZED,
      statusCode: "401",
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
      templates: {
        "application/json":
          '{ "message": $context.error.messageString, "statusCode": "401", "type": "$context.error.responseType" }',
      },
    });
    
    api.root.addResource("movePosterAPIDesign").addMethod("GET",new cdk.aws_apigateway.LambdaIntegration(bedrockLambda,{
      requestTemplates:{
        'application/json':`{
          "prompt": "$input.params('prompt')"
        }`
      },
      proxy:false,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': ''  // Pass through the response as is
        },
        responseParameters: {
          'method.response.header.Content-Type': 'integration.response.header.Content-Type',
        }
      }]
    }), {
      requestParameters:{
        'method.request.querystring.prompt':true
      },
      requestValidatorOptions:{
        validateRequestParameters:true,
      },
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': cdk.aws_apigateway.Model.EMPTY_MODEL
        },
        responseParameters: {
          'method.response.header.Content-Type': true,
        }
      }],
    })
    bucket.grantReadWrite(bedrockLambda)
    bedrockLambda.addToRolePolicy(bedrockAccessPolicy)

  }
}

module.exports = { BedrockCdkStack }
