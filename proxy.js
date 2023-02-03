import http from 'http';
import httpProxy from 'http-proxy';
import connect from 'connect';
import bodyParser from 'body-parser';
import { runAuthenticate, getAuthenticationDetails } from "./authenticate.js";

const proxy = httpProxy.createProxyServer({});

/************** START: EDIT THIS *******************/
const namespace = process.env.NAMESPACE;
const proxyPort = process.env.PORT;
const placeholderNamespace = process.env.PLACEHOLDER_NAMESPACE;
const placeholderUrl = process.env.PLACEHOLDER_URL;
const endpointHeader = process.env.ENDPOINT_HEADER;

const requestBodyEnricher = function(body) {
    const bodyInput = JSON.parse(body.input || '{}');
    if (body.sClassName === "apex.loyaltymanagement.WidgetJoinLoyaltyProgram" && body.sMethodName === "enrollMemberToLoyaltyProgram") {
        bodyInput["membershipNumber"] = "M" + (new Date()).getTime();
        console.log("Enriched with membership number.");
    }
    console.log(JSON.stringify(bodyInput));
    return JSON.stringify(bodyInput)
};
/************** END: EDIT THIS *******************/

proxy.on('proxyReq', function(proxyReq, req, res, options) {
    if (req.body) {
        const cloneBody = JSON.parse(JSON.stringify(req.body));
        cloneBody.input = requestBodyEnricher(cloneBody);
        let bodyData = JSON.stringify(cloneBody);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.setHeader('Authorization', 'Bearer ' + getAuthenticationDetails()["accessToken"]);
        proxyReq.write(bodyData);
    }
});

proxy.on("proxyRes", function(proxyRes, req, res) {
    enableCors(req, res);
});

const app = connect();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function(req, res) {
    if (req.method === 'OPTIONS') {
        enableCors(req, res);
        res.writeHead(200);
        res.end();
        return;
    }
    proxy.web(req, res, { target: getRequestURL(req), secure: false, changeOrigin: true });
});

const server = http.createServer(app);

const getRequestURL = function(req) {
    return getAuthenticationDetails()["instanceUrl"] + req.headers[endpointHeader].replace(placeholderNamespace, namespace).split(placeholderUrl)[1]
}

const enableCors = function(req, res) {
    if (req.headers['access-control-request-method']) {
        res.setHeader('access-control-allow-methods', req.headers['access-control-request-method']);
    }

    if (req.headers['access-control-request-headers']) {
        res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
    }

    if (req.headers.origin) {
        res.setHeader('access-control-allow-origin', req.headers.origin);
        res.setHeader('access-control-allow-credentials', 'true');
    }
};

export function startProxy() {
    runAuthenticate();
    server.listen(proxyPort);
}