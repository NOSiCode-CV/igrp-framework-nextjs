// Serves only the OIDC discovery document, so NextAuth can build the authorize
// URL. Nothing else answers: the browser never reaches the authorize endpoint.
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 3109);
const issuer = `http://127.0.0.1:${port}`;

createServer((req, res) => {
  if (req.url === "/.well-known/openid-configuration") {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        issuer,
        authorization_endpoint: `${issuer}/oauth2/authorize`,
        token_endpoint: `${issuer}/oauth2/token`,
        jwks_uri: `${issuer}/oauth2/jwks`,
        end_session_endpoint: `${issuer}/connect/logout`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        code_challenge_methods_supported: ["S256"],
      }),
    );
    return;
  }
  res.statusCode = 404;
  res.end();
}).listen(port, "127.0.0.1");
