# User service serverless


## Installation


```bash
npm install serverless-offline
npm install -g serverless@1.83.1
```

## Usage

```bash
npm install
sls dynamodb install
npm start
```

## APIs
* Populate users
```rest
/POST http://localhost:3000/populate-data
```
* Filter users
```rest
/GET http://localhost:3000/users?q=A&limit=100&key=41f4a87d-5f95-481f-916f-d1e03275b81c

Query:
q: string
limit: number // default 100
key: LastEvaluatedKey // For paggination
```