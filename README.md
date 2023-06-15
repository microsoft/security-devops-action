# microsoft/security-devops-action (Preview)

Microsoft Security DevOps (MSDO) is a command line application which integrates static analysis tools into the development cycle. MSDO installs, configures and runs the latest versions of static analysis tools (including, but not limited to, SDL/security and compliance tools). MSDO is data-driven with portable configurations that enable deterministic execution across multiple environments. For tools that output results in or MSDO can convert their results to SARIF, MSDO imports into a normalized file database for seamlessly reporting and responding to results across tools, such as forcing build breaks.

Run locally. Run remotely.

![Microsoft Security DevOps](https://github.com/microsoft/security-devops-action/workflows/MSDO%20Sample%20Workflow/badge.svg)  

This action runs the [Microsoft Security DevOps CLI](https://aka.ms/msdo-nuget) for security analysis:

* Installs the Microsoft Security DevOps CLI
* Installs the latest Microsoft security policy
* Installs the latest Microsoft and 3rd party security tools
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
  uses: microsoft/security-devops-action@v1
  id: msdo
```

## Upload Results to the Security tab

To upload results to the Security tab of your repo, run the `github/codeql-action/upload-sarif` action immediately after running MSDO. MSDO sets the action output variable `sarifFile` to the path of a single SARIF file that can be uploaded to this API.

```yaml
- name: Upload results to Security tab
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: ${{ steps.msdo.outputs.sarifFile }}
```

# Tools

| Name | Language | License |
| --- | --- | --- |
| [AntiMalware](https://www.microsoft.com/en-us/windows/comprehensive-security) | code, artifacts | - |
| [Bandit](https://github.com/PyCQA/bandit) | python | [Apache License 2.0](https://github.com/PyCQA/bandit/blob/master/LICENSE) |
| [BinSkim](https://github.com/Microsoft/binskim) | binary - Windows, ELF | [MIT License](https://github.com/microsoft/binskim/blob/main/LICENSE) |
| [ESlint](https://github.com/eslint/eslint) | JavaScript | [MIT License](https://github.com/eslint/eslint/blob/main/LICENSE) |
| [Template Analyzer](https://github.com/Azure/template-analyzer) | Infrastructure-as-code (IaC), ARM templates, Bicep files | [MIT License](https://github.com/Azure/template-analyzer/blob/main/LICENSE.txt) |
| [Terrascan](https://github.com/accurics/terrascan) | Infrastructure-as-code (IaC), Terraform (HCL2), Kubernetes (JSON/YAML), Helm v3, Kustomize, Dockerfiles, Cloudformation | [Apache License 2.0](https://github.com/accurics/terrascan/blob/master/LICENSE) |
| [Trivy](https://github.com/aquasecurity/trivy) | container images, file systems, and git repositories | [Apache License 2.0](https://github.com/aquasecurity/trivy/blob/main/LICENSE) |

# More Information

Please see the [wiki tab](https://github.com/microsoft/security-devops-action/wiki) for more information and the [Frequently Asked Questions (FAQ)](https://github.com/microsoft/security-devops-action/wiki/FAQ) page.

# Report Issues

Please [file a GitHub issue](https://github.com/microsoft/security-devops-action/issues/new) in this repo. To help us investigate the issue, please include a description of the problem, a link to your workflow run (if public), and/or logs from the MSDO action's output.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributing

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).
