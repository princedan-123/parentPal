# API Documentation

**Base Url**
All the endpoints uses either of the following base url. It should be noted that at the time of writing, the project has not been hosted hence the localhost was used as the base url.

 - www.http://localhost:8080
 - www.https://localhost:8080


**Endpoints**
The api contains the following endpoints
 - /createTutor
 - /login
 - /viewTutorProfile
 - /logout_tutor
 - /removeTutor
 - /updateTutorProfile

<h2>createTutor Endpoint:</h2>
This endpoints creates a new tutor resource. it utilizes an external api(tomtom api) for geocoding the tutor's location (latitude and longitude).
**Request data**
Method: This endpoint uses a POST HTTP metod
url: www.http://localhost:8080/createTutor
Request header: The Content-Type header should be application/json as the post request body is a json payload.
Body: The POST request body should be a json payload with the following mandatory fields
	

    {
	    "firstName":  "string",
	    "lastName":  "string",
	    "userName":  "string",
	    "subject": ["array of subjects"],
	    "available":  true,
	    "qualifications": [],
	    "phoneNumber":  "string",
	    "email":  "string",
	    "password":  "string",
	    "socialMediaHandles": [],
	    "country":  "string",
	    "state":  "string",
	    "city":  "string",
	    "area":  "string",
	    "street":"string"
}


**Response**

Status code 400 : A 400 status code with a json missing field  indicates that one of the fields is missing. If email or password field is missing the json error field will indicate missing email or missing password

    {
	    "error": "missing email field"
    }
    {
	    "error": "missing password field"
    }

Status code 201: This indicates the tutor resource was created sucessfully. A json payload is also return with the userId field
Status code 500: This indicates an internal server issue from the utilization of the tomtom geocoding API.
<h2>/login endpoint:</h2>
This enpoint takes authentication credentials (email and password) and  gives a specific tutor resource access to the app after authenticating the login credentials. it logs in the user and utilizes session based authentication to keep the user authenticated through out the session.
**Request data**
Method: This endpoint uses a POST HTTP metod
url: www.http://localhost:8080/login
Request header: The Content-Type header should be application/x-www-form-urlencoded as the post request body is a urlencoded form data
Body: The request body of the POST request is a urlencoded form data with the email key containing the tutor's email and the password key containing the tutor's password.
**Response**
Status code 200: This means the tutor is logged in successfully. A json payload with a status field with "logged in" as its value.

    {
	    "status": "logged in"
    }
 Status code 404: A 404 status code  is  returned if the email key contains an invalid email or the password key contains an invalid password. If the email key is invalid, a json payload with an error field and the value 'incorrect email' is returned.
 

    {
	    "error": "incorrect email"
    }
 If the password key is invalid, a json payload with an error field and the value 'incorrect password is returned'.
 

    {
	    "error": "incorrect password"
    }
 Status code 500: A 500 status code is returned if  the database is unable to authenticate the tutor.
 
  <h2>viewTutorProfile:</h2>
  This endpoint is used to acess public or non sensisitive information about the tutor resource.
  **Request data**: 
  Method: This endpoint uses a GET HTTP metod.
url: www.http://localhost:8080/viewTutorProfile.
**Response**
Status code 200: A 200 status code and a json payload containinig information about the tutor resource is returned.

    {
	    "firstName":  "Daniel",
	    "lastName":  "Mabia",
	    "userName":  "De Prince",
	    "qualifications": [
            "Bsc Animal and Enviromental Biology",
            "Msc parasitology"
            ],
		"available":  false,
		"country":  "Nigeria",
		"state":  "Edo",
		"city":  "Benin City",
		"area":  "Upper sakponba",
		"street":  "Iso street"
	}
Status Code 404: A  404 status code indicates that the user is not found. This is due to the user not being authenticated. A json payload is also returned along side this status code.

    {
	    "error": "user not found"	
    }


<h2>/logout_tutor:</h2>
It destroys removes the user from the app session my destroying the session object, clears the session cookie.
**Request data**
Method: This endpoint uses a DELETE HTTP metod
url: www.http://localhost:8080/logout_tutor
**Response**
Status code 404: This indicates the user is not found in the session. It is followed by a json response.

    {	
	    "error": "user not logged in"
    }
Status code 200: A json response along with a status code is returned to signify that a tutor successfully logged out.

    {	
	    "message" "succesfully logged out ${userName}"
    }
Status code 500: this indicates that an internal error occured and the user is still active.

    {	
	    "error": "${userName} is still active"
    }


<h2>/updateTutorProfile:</h2>
It updates or changes certain fields in the user profile. Note sensitive fields like email and  password can not be changed.
**Request data**
Method: This endpoint uses a PATCH HTTP metod
url: www.http://localhost:8080/updateTutorProfile
Request header: It should contain  a Content-Type header of application/json
Request body: The PATCH request should contain a json payload that contains the fields the tutor wants to change with their corresponding values.
For example:

    {	
	    "available": "false"
    }
The following are the only fields that can be changed:

 - subjects
 - available
 - qualifications
 - phoneNumber
 - socialMediaHandles
 - country
 - state
 - city
 - area
 - street

**Response**
Status code 400: This indicates a bad request. It is followed by a json request which indicates the error.
When you attempt to change an unauthorized field.

    {	
	    "message": "you cannot update this ${field}"
    }
    
When no new data was introduced

    {	
	    "message": |no changes were made to profile"
    }
Status code 404: This indicates the user was not found in the session. it is accompanied by a json payload:

    {	
	    "error": "user not found"
    }

Status code 200: If the update was successful, a status code 200 along with a json payload indicating the field that was updated is returned.

    {	
	    "message": "successfully updated ${fieldName} field"
    }

Status code 500: this indicates that an internal error in the database operation

    {	
	    "error": "error message"
    }


<h2>/removeTutor:</h2>
It deletes a tutor's account from the database.
**Request data**
Method: This endpoint uses a DELETE HTTP metod
url: www.http://localhost:8080/removeTutor
Request header: It should contain  a Content-Type header of application/json
Request body: The Delete request should contain a json payload with email and password fields.

    {	
	    "email": "string",
	    "password": "string"
    }


**Response**
Status code 404: This indicates the user is not found in the session or the user is not found in the database.  It is followed by a json response.
If the user is not found in the session:

    {	
	    "error": "user not logged in"
    }
 If the user is not found in the database:
 

    {	
	    "error": "user not found"
    }

 Status code 400: This indicates the a bad request. It could be as a result of a missing email or password field. It could also be as a result of an incorrect password. The json payload returned indicates the error message.
For missing email field:

    {	
	    "unauthorized": "email field is required"
    }
For missing password field:

    {	
	    "unauthorized": "password field is required"
    }
    {	
	    "unauthorized": "incorrect password"
    }


Status code 200: A json response along with the status code 200 is returned to signify that the tutor's account has been successfully removed.

    {	
	    "message" "${userName}'s account has been successfully removed"
    }
Status code 500: this indicates that an internal error in the database operation

    {	
	    "error": "error message"
    }
