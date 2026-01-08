using http only cookies

1 => from client side send the ingormation (email, detter: firebase auth token) to gemerate token
2 => on the server side accept user information and if needed validate it 
3 => generate token in the server side using secret and expiresIn(optional)

set the cookies

4 => while calling the api from client tell to use withCredentials 
        ex => axios.post("http://localhost:3000/jwt", userData, {
                    withCredentials: true
                })

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