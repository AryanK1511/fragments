# Unauthenticated users should not be allowed to create a fragment

POST http://localhost:8080/v1/fragments
Content-Type: text/plain

`This`

HTTP 401

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
