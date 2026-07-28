# microsoft/security-devops-action (Preview)

Microsoft Security DevOps (MSDO) is a command line application which integrates static analysis tools into the development cycle. MSDO installs, configures and runs static analysis tools (including, but not limited to, SDL/security and compliance tools). MSDO is data-driven with portable configurations that enable deterministic execution across multiple environments. For tools that output results in or MSDO can convert their results to SARIF, MSDO imports into a normalized file database for seamlessly reporting and responding to results across tools, such as forcing build breaks.

Run locally. Run remotely.

![Microsoft Security DevOps](https://github.com/microsoft/security-devops-action/workflows/MSDO%20Sample%20Workflow/badge.svg)  

This action runs the [Microsoft Security DevOps CLI](https://aka.ms/msdo-nuget) for security analysis:

* Installs the Microsoft Security DevOps CLI
* Installs the latest Microsoft security policy
* Installs the Microsoft and 3rd party security tools bundled with that CLI release
* Automatic or user-provided configuration of security tools
* Execution of a full suite of security tools
* Normalized processing of results into the SARIF format
* Build breaks and more

# Usage

See [action.yml](action.yml)

## Basic

Run **Microsoft Security DevOps (MSDO)** with the default policy and recommended tools.

```yaml
permissions:
  security-events: write

steps:

- uses: actions/checkout@v3

- name: Run Microsoft Security DevOps
  uses: microsoft/security-devops-action@latest
  id: msdo
```

## Upload Results to the Security tab

To upload results to the Security tab of your repo, run the `github/codeql-action/upload-sarif` action immediately after running MSDO. MSDO sets the action output variable `sarifFile` to the path of a single SARIF file that can be uploaded to this API.

```yaml
- name: Upload results to Security tab
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: ${{ steps.msdo.outputs.sarifFile }}
```

## Publish results from another tool

To send SARIF produced by a tool this action does not run, set `existingFilename` to that file. The analyzers are skipped and the file is uploaded to the MSDO backend instead.

```yaml
- name: Run a third party scanner
  run: my-scanner --sarif-output results.sarif

- name: Publish existing SARIF
  uses: microsoft/security-devops-action@latest
  with:
    existingFilename: results.sarif
```

Run this as its own step. When `existingFilename` is set no analyzers run, so it cannot be combined with a scanning step, and the `sarifFile` output is not set. To also surface the file in the Security tab, pass it to `github/codeql-action/upload-sarif` directly.

## Advanced

To only run specific analyzers, use the `tools` command. This command is a comma-seperated list of tools to run. For example, to run only the `container-mapping` tool, configure this action as follows:

```yaml
- uses: microsoft/security-devops-action@latest
  id: msdo
  with:
    tools: container-mapping
```

## How tools are selected

If `tools` is not set, the MSDO CLI decides which analyzers to run by inspecting the repository contents. That selection logic lives in the CLI, not in this action. If `tools` is set, only the listed analyzers run and no content based selection takes place.

Use `categories` or `languages` to narrow a run while still letting the CLI select the tools.

`container-mapping` behaves differently from the other entries in the table below. It is implemented by this action's `pre` and `post` steps rather than by the CLI, so it is never passed to the CLI as an analyzer, and its pre and post steps run on every use of this action regardless of `tools`. Listing it as the only value of `tools` is therefore how you skip the analyzer run and keep container mapping on its own.

# Tools

| Name | Language | License |
| --- | --- | --- |
| [AntiMalware](https://www.microsoft.com/en-us/windows/comprehensive-security) | code, artifacts | - |
| [Bandit](https://github.com/PyCQA/bandit) | python | [Apache License 2.0](https://github.com/PyCQA/bandit/blob/master/LICENSE) |
| [BinSkim](https://github.com/Microsoft/binskim) | binary - Windows, ELF | [MIT License](https://github.com/microsoft/binskim/blob/main/LICENSE) |
| [Checkov](https://github.com/bridgecrewio/checkov) | Infrastructure-as-code (IaC), Terraform, Terraform plan, Cloudformation, AWS SAM, Kubernetes, Helm charts, Kustomize, Dockerfile, Serverless, Bicep, OpenAPI, ARM Templates, or OpenTofu  | [Apache License 2.0](https://github.com/bridgecrewio/checkov/blob/main/LICENSE) |
| [ESlint](https://github.com/eslint/eslint) | JavaScript | [MIT License](https://github.com/eslint/eslint/blob/main/LICENSE) |
| [Template Analyzer](https://github.com/Azure/template-analyzer) | Infrastructure-as-code (IaC), ARM templates, Bicep files | [MIT License](https://github.com/Azure/template-analyzer/blob/main/LICENSE.txt) |
| [Terrascan](https://github.com/accurics/terrascan) | Infrastructure-as-code (IaC), Terraform (HCL2), Kubernetes (JSON/YAML), Helm v3, Kustomize, Dockerfiles, Cloudformation | [Apache License 2.0](https://github.com/accurics/terrascan/blob/master/LICENSE) |
| [Trivy](https://github.com/aquasecurity/trivy) | container images, file systems, and git repositories | [Apache License 2.0](https://github.com/aquasecurity/trivy/blob/main/LICENSE) |
| [container-mapping](https://learn.microsoft.com/en-us/azure/defender-for-cloud/container-image-mapping) | container images and registries (only available for DevOps security enabled CSPM plans) | [MIT License](https://github.com/microsoft/security-devops-action/blob/main/LICENSE) |

Tool versions are pinned to the installed Microsoft Security DevOps CLI release rather than resolved independently, so a version published upstream is only picked up once a CLI release that bundles it is available.

# More Information

Please see the [wiki tab](https://github.com/microsoft/security-devops-action/wiki) for more information and the [Frequently Asked Questions (FAQ)](https://github.com/microsoft/security-devops-action/wiki/FAQ) page.

# Report Issues

Please [file a GitHub issue](https://github.com/microsoft/security-devops-action/issues/new) in this repo. To help us investigate the issue, please include a description of the problem, a link to your workflow run (if public), and/or logs from the MSDO action's output.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributing

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).
