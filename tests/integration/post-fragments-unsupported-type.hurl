# Users should not be able to create a fragment whose type is not supported by the API

POST http://localhost:8080/v1/fragments
Content-Type: text/invalid

[BasicAuth]
user1@email.com:password1

file, file.txt;

HTTP 415

[Asserts]

jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" == "Unsupported Content-Type"
