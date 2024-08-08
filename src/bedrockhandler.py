import boto3
from botocore.config import Config
import json

bedrock_config = Config(
    region_name = "us-west-2"
)
client_bedrock = boto3.client('bedrock-runtime',config=bedrock_config)
client_s3 = boto3.client('s3')

def handler(event,context):
    print("Hello from lambda handler")
    input_prompt = event['prompt']
    response_bedrock = client_bedrock.invoke_model(
    body=json.dumps({
        "text_prompts": [{ "text": input_prompt}],
        "cfg_scale": 10,
        "seed": 0,
        "steps": 30,
    }),
    contentType='application/json',
    accept='application/json',
    modelId='stability.stable-diffusion-xl-v1',   
    )
    print("response bedrock call ")
    print(response_bedrock)
    response_bedrock_byte = json.loads(response_bedrock['body'].read())
    print("response in bytes")
    print(response_bedrock_byte)
    return {
        'status':200,
        'body':json.dumps('Hello From Lambda')
    }
