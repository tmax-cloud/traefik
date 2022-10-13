package console

import (
	"github.com/gorilla/mux"
	"github.com/traefik/traefik/v2/frontend"
	traefikversion "github.com/traefik/traefik/v2/pkg/version"
	"net/http"
	"runtime"
)

const (
	indexPageTemplateName          = "index.html"
	prometheusProxyEndpoint        = "/api/prometheus"
	prometheusTenancyProxyEndpoint = "/api/prometheus-tenancy"
	alertManagerProxyEndpoint      = "/api/alertmanager"

	customProductName  = "hypercloud"
	traefikServiceType = "LoadBalancer"

	keycloakURL      = "https://hyperauth.hyperauth.svc/auth"
	keycloakRealm    = "tmax"
	keycloakClientId = "hypercloud5"

	consoleBasePath    = "/"
	staticFileEndpoint = "/static/"

	kubeAPIServerURL = "kubernetes.default.svc"
)

type Console struct {
	McMode            bool   `description:"Activate Multi-Cluster Mode" json:"mcMode" toml:"mcMode,omitempty" yaml:"mcMode,omitempty" export:"true"`
	ChatbotEmbed      bool   `description:"Activate Chatbot" json:"chatbotEmbed" toml:"chatbotEmbed,omitempty" yaml:"chatbotEmbed,omitempty" export:"true"`
	CustomProductName string `description:"Setting Custom Product Name" json:"customProductName" toml:"customProductName,omitempty" yaml:"customProductName,omitempty" export:"true"`

	SvcType string `description:"Service type of api-gateway(traefik) default: LoadBalancer" yaml:"svcType" json:"svcType" export:"true"`

	KeycloakAuthURL  string `description:"HyperAuth(keycloak) URL, format: https://hyperauth.org/auth" json:"keycloakAuthURL,omitempty" toml:"keycloakAuthURL,omitempty" yaml:"keycloakAuthURL,omitempty" export:"true"`
	KeycloakRealm    string `description:"keycloak realm info" yaml:"keycloakRealm" json:"keycloakRealm" toml:"keycloakRealm" export:"true"`
	KeycloakClientId string `description:"keycloak cliend id" yaml:"keycloakClientId" json:"keycloakClientId" toml:"keycloakClientId" export:"true"`

	KubeAPIServerURL string `description:"kube API URL" json:"kubeAPIServerURL" yaml:"kubeAPIServerURL" toml:"kubeAPIServerURL" export:"true"`
}

// SetDefaults sets the default values.
func (c *Console) SetDefaults() {
	c.McMode = true
	c.ChatbotEmbed = true
	c.CustomProductName = customProductName
	c.SvcType = traefikServiceType
	c.KeycloakAuthURL = keycloakURL
	c.KeycloakRealm = keycloakRealm
	c.KeycloakClientId = keycloakClientId
	c.KubeAPIServerURL = kubeAPIServerURL
}

// func (c *Console) CreateRouter() http.Handler {
func (c *Console) CreateRouter() *mux.Router {
	router := mux.NewRouter()

	// Serving Ingress Info (using proxy)

	// Serving SPA
	router.
		PathPrefix(staticFileEndpoint).
		Handler(http.StripPrefix(staticFileEndpoint, gzipHandler(http.FileServer(http.FS(frontend.FS)))))

	// serving index.html with index values as json format
	index := &Index{
		BasePath:                 consoleBasePath,
		ConsoleVersion:           traefikversion.Version,
		GOARCH:                   runtime.GOARCH,
		GOOS:                     runtime.GOOS,
		PrometheusBaseURL:        prometheusProxyEndpoint,
		PrometheusTenancyBaseURL: prometheusTenancyProxyEndpoint,
		AlertManagerBaseURL:      alertManagerProxyEndpoint,

		KeycloakAuthURL:   c.KeycloakAuthURL,
		KeycloakRealm:     c.KeycloakRealm,
		KeycloakClientId:  c.KeycloakClientId,
		KubeAPIServerURL:  c.KubeAPIServerURL,
		SvcType:           c.SvcType,
		McMode:            c.McMode,
		ChatbotEmbed:      c.ChatbotEmbed,
		CustomProductName: c.CustomProductName,
	}
	router.Methods(http.MethodGet).
		PathPrefix(consoleBasePath).
		HandlerFunc(index.indexHandler)

	return router
}
