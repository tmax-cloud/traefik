package console

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
	"github.com/traefik/traefik/v2/pkg/console/proxy"
	"github.com/traefik/traefik/v2/pkg/log"
	"io/ioutil"
	"net/http"
	"net/url"
)

type K8sHandler struct {
	K8sProxy  *proxy.Proxy
	K8sClient *http.Client
	K8sToken  string
}

func NewK8sHandlerConfig(k8sEndpoint string, k8sToken string) *K8sHandler {
	const (
		k8sInClusterCA          = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
		k8sInClusterBearerToken = "/var/run/secrets/kubernetes.io/serviceaccount/token"
		defaultK8sEndpoint      = "https://kubernetes.default.svc"
	)
	// Proxy Setting
	var (
		k8sAuthServiceAccountBearerToken string
		k8sURL                           *url.URL
	)
	k8sProxyConfig := &proxy.Config{}
	k8sClient := &http.Client{}

	// Console In Cluster
	if k8sEndpoint == "" || k8sEndpoint == defaultK8sEndpoint {
		k8sEndpoint = defaultK8sEndpoint
		k8sCertPEM, err := ioutil.ReadFile(k8sInClusterCA)
		if err != nil {
			log.WithoutContext().Errorf("Error inferring Kubernetes config from environment: %v", err)
		}
		rootCAs := x509.NewCertPool()
		if !rootCAs.AppendCertsFromPEM(k8sCertPEM) {
			log.WithoutContext().Error("No CA found for the API server")
		}
		tlsConfig := oscrypto.SecureTLSConfig(&tls.Config{
			RootCAs: rootCAs,
		})
		bearerToken, err := ioutil.ReadFile(k8sInClusterBearerToken)
		k8sAuthServiceAccountBearerToken = string(bearerToken)
		if err != nil {
			log.WithoutContext().Errorf("failed to read bearer token: %v", err)
		}
		k8sURL = validateURL("k8sEndpoint", k8sEndpoint)
		k8sProxyConfig = &proxy.Config{
			TLSClientConfig: tlsConfig,
			HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
			Endpoint:        k8sURL,
			Origin:          "http://localhost",
		}
		k8sClient = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: k8sProxyConfig.TLSClientConfig,
			},
		}
		// Console Off Cluster
	} else {
		k8sAuthServiceAccountBearerToken = k8sToken
		k8sURL = validateURL("k8sEndpoint", k8sEndpoint)
		k8sProxyConfig = &proxy.Config{
			HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
			TLSClientConfig: oscrypto.SecureTLSConfig(&tls.Config{
				InsecureSkipVerify: true,
			}),
			Endpoint: k8sURL,
			Origin:   "http://localhost",
		}
		k8sClient = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: k8sProxyConfig.TLSClientConfig,
			},
		}
	}

	return &K8sHandler{
		K8sProxy:  proxy.NewProxy(k8sProxyConfig),
		K8sClient: k8sClient,
		K8sToken:  k8sAuthServiceAccountBearerToken,
	}
}

func validateURL(s string, endpoint string) *url.URL {
	if endpoint == "" {
		log.WithoutContext().Errorf("Error parsing %s: no URL specified", s)
	}
	// validate the URL
	u, err := url.Parse(endpoint)
	if err != nil {
		log.WithoutContext().Errorf("Error parsing %s", s)
	}
	if u.Scheme == "" {
		log.WithoutContext().Errorf("Error parsing %s: no URL scheme specified", s)
	}
	if u.Host == "" {
		log.WithoutContext().Errorf("Error parsing %s: no URL host specified", s)
	}
	return u
}

func (k *K8sHandler) proxyHandler(w http.ResponseWriter, r *http.Request) {
	log.FromContext(r.Context()).Debug("Proxy k8s with a console token")
	r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", k.K8sToken))
	k.K8sProxy.ServeHTTP(w, r)
}
