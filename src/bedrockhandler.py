import boto3
from botocore.config import Config
import json
import base64
import datetime

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
    # print(response_bedrock_byte)
    response_bedrock_base64 = response_bedrock_byte['artifacts'][0]['base64']
    response_bedrock_finalimage = base64.b64decode(response_bedrock_base64)
    print("response bedrock final image")
    print(response_bedrock_finalimage)
    poster_name = f"posterName-{datetime.datetime.today().strftime('%Y-%M-%D-%M-%S')}"
    bucket_name = 'movieposterdesignstorebucket'
    response_s3 = client_s3.put_object(
        Bucket= bucket_name,
        Key=poster_name,
        Body=response_bedrock_finalimage
    )
    generate_presigned_url = client_s3.generate_presigned_url('get_object', 
                                                              Params={'Bucket':bucket_name,'Key':poster_name}, 
                                                              ExpiresIn=3600)
    print("generate presigned")
    print(generate_presigned_url)
    return {
        'status':200,
        'body':json.dumps('Hello From Lambda')
    }
