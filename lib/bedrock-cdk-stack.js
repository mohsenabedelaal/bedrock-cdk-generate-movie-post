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
    const bucket = new aws_s3.Bucket(this, 'moviePosterDesignStore');
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
    bucket.grantReadWrite(bedrockLambda)
    bedrockLambda.addToRolePolicy(bedrockAccessPolicy)

  }
}

module.exports = { BedrockCdkStack }
