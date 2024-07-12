# The API should throw a 404 error if a route that is not defined is accessed by the user

GET http://localhost:8080/no-route

HTTP 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "not found"
