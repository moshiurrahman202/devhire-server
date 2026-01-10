using http only cookies

1 => from client side send the ingormation (email, detter: firebase auth token) to gemerate token
2 => on the server side accept user information and if needed validate it 
3 => generate token in the server side using secret and expiresIn(optional)

set the cookies

4 => while calling the api from client tell to use withCredentials 
        ex => axios.post("http://localhost:3000/jwt", userData, {
                    withCredentials: true
                })
        or for fetch option credentials: "include"

5 => in the cors setting set credentials and origin
        ex => app.use(cors({
                origin: ["http://localhost:5173"],
                credentials: true
             }))

6 => after generating the token sert it to the cookies with some options
            ex => res.cookie("token", token, {
                     httpOnly: true, 
                     // if it is not production set secure false
                      secure: false
                  })

7 => one time: use cookiesParser as middleware

8 => every api i want to verify token: in the client side: if using axios withCredentials: true; and if use fetch credentials: include

verifay token

9 => check token exist, if not , return statsu 401 message unauthorized
10 => jwt.verify , if err return status 403 message forbidden
11 => if token valid set the decoded value to the req
12 => whene user want data by api => check user information to cookies decoded informations. if dosen't match return status 422 message Validation error or(any status any message depend on xyz)