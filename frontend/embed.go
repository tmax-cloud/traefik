package frontend

import (
	"embed"
	"io/fs"
)

//go:embed public/dist
var assets embed.FS

// FS contains the web UI assets.
var FS, _ = fs.Sub(assets, "public/dist")
