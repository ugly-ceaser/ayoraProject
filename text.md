Subject: Assistance Required with API Endpoint https://api.aurinko.io/v1/auth/authorize & https://api.aurinko.io/v1/auth/token/{code}

Dear Aurinko Support Team,

I hope this message finds you well. I am reaching out regarding the API endpoint https://api.aurinko.io/v1/auth/authorize & https://api.aurinko.io/v1/auth/token/{code}, which seems not to be working as expected.

Despite following the documentation and ensuring proper implementation on my end, I am encountering issues with the endpoint's response. Below are some details to provide context:

https://api.aurinko.io/v1/auth/authorize
Request Method: [GET]
Request Payload [QUERY]: 
    ?clientId=xxx
    &serviceType=Google
    &scopes=Mail.Read+Mail.ReadWrite+Mail.Send+Mail.Drafts+Mail.All
    &responseType=code
    &returnUrl=xxx%3A3000%2Fapi%2Faurinko%2Fcallback
Response Received: ?
  authuser=0
  &code=xxxx
  &prompt=consent
  &scope=email profile https://mail.google.com/ openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  &state=xxx

Expected Outcome: The code returned from the above request returns 404 error on the https://api.aurinko.io/v1/auth/token/:code request.

I would appreciate it if you could assist in identifying the issue or guide me on any adjustments needed to use the endpoint correctly. If necessary, I can provide additional logs or details.

Thank you for your support. I look forward to your response.

Best regards,
Martins
Software Engineer
martins.paraclet@yahoo.com