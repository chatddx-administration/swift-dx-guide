# swift/flake.nix
{
  description = "build chatddx-swift";
  inputs = {
    nixpkgs.url = "github:kompismoln/nixpkgs/nixos-unstable"; # org-wide version pin
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      name = "chatddx-swift";
      inherit (nixpkgs) lib;
      version = toString (self.shortRev or self.dirtyShortRev or self.lastModified or "unknown");
      forAllSystems = lib.genAttrs lib.systems.flakeExposed;

      swift-app =
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          src = ./.;
        in
        pkgs.stdenv.mkDerivation {
          pname = name;
          inherit src version;

          VITE_API_URL = "";

          nativeBuildInputs = with pkgs; [
            nodejs_22
            pnpm
            pnpmConfigHook
          ];

          pnpmDeps = pkgs.fetchPnpmDeps {
            pname = name;
            inherit version src;
            fetcherVersion = 3;
            hash = "sha256-jNKNmeDo/VKutEaQl9CuGx6eo2blCnZrKWmBWtBS6Wc=";
          };

          buildPhase = ''
            runHook preBuild
            rm -f .env
            pnpm build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r dist/* $out/
            runHook postInstall
          '';
        };

    in
    {

      packages = forAllSystems (system: {
        default = swift-app system;
      });
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            inherit name;
            packages = [
              (pkgs.writeScriptBin "npm" ''echo "use pnpm"'')
              (pkgs.writeScriptBin "bun" ''echo "use pnpm"'')
              (pkgs.writeScriptBin "npx" ''echo "use pnpm dlx"'')

              pkgs.nodejs_22
              pkgs.pnpm
            ];
            shellHook = ''
              set -a
              source .env
              set +a
              echo "• Flake version: ${version}"
              echo "• Nixpkgs:       ${nixpkgs.shortRev}"
              echo "• Node version:  $(node --version)"
              echo "• PNPM version:   $(pnpm --version)"
            '';
          };
        }
      );

    };
}
