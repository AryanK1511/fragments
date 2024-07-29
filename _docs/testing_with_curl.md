# Testing the API with curl

Be sure to run the server using basic auth for the following commands to run. If you are using Cognito auth, you will have to pass the authorization header everytime you make a request. This is only a good idea when you are running the frontend.

## Testing the `POST` route

```bash
curl -u "user1@email.com:password1" -s -X POST -H "Content-Type: application/json" --data-binary '@tests/files/file.json' localhost:8080/v1/fragments | jq
```

## Testing the `GET` route

```bash
curl -X GET -u user1@email.com:password1 http://localhost:8080/v1/fragments/188e609c-6925-4da7-bd2a-7c4f014604b9
```

```bash
curl -X GET -u user1@email.com:password1 http://localhost:8080/v1/fragments/188e609c-6925-4da7-bd2a-7c4f014604b9.txt
```

```bash
curl -X GET -u user1@email.com:password1 http://localhost:8080/v1/fragments
```

```bash
curl -X GET -u user1@email.com:password1 http://localhost:8080/v1/fragments\?expand=1
```

## Testing the `PUT` route

```bash
curl -u "user1@email.com:password1" -s -X PUT -H "Content-Type: image/png" --data-binary '@tests/files/file.png' http://localhost:8080/v1/fragments/79b8d6ce-0531-4009-82d3-3b074667f195
```

## Testing the `DELETE` route

```bash
curl -X DELETE -u user1@email.com:password1 http://localhost:8080/v1/fragments/49ae9e73-a214-4e17-aac7-9426c3a644d0
```
