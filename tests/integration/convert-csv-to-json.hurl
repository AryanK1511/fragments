# 1. Try to create a CSV fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/csv

[BasicAuth]
user1@email.com:password1

file, file.csv;

HTTP 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/csv"
jsonpath "$.fragment.size" == 67

[Captures]
url: header "Location"

# 2. Try to get the data for the CSV fragment that we just created
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
body == ```
Student,marks1,marks2
Student1,32,63
Student2,83,62
Student3,29,30
```

# 2. Try to convert the CSV fragment that we just created into a JSON fragment
GET {{url}}.json

[BasicAuth]
user1@email.com:password1

HTTP 200

[Asserts]
body == ```[{"Student":"Student1","marks1":"32","marks2":"63"},{"Student":"Student2","marks1":"83","marks2":"62"},{"Student":"Student3","marks1":"29","marks2":"30"}]```
