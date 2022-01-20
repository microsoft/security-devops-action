# microsoft/security-devops-action

![Microsoft Security DevOps windows-latest](https://github.com/microsoft/security-devops-action/workflows/MSDO%20windows-latest/badge.svg)  
![Microsoft Security DevOps ubuntu-latest](https://github.com/microsoft/security-devops-action/workflows/MSDO%20ubuntu-latest/badge.svg)

This action runs the [Microsoft Security DevOps CLI](https://aka.ms/msdo-nuget) for security analysis:

* Installs the Microsoft Security DevOps CLI
* Installs the latest Microsoft security policy
* Installs the latest Microsoft and 3rd party security tools
* Automatic or user-provided configuration of security tools
* Execution of a full suite of security tools
* Normalized processing of results into the SARIF format
* Build breaks and more

# Limitations

The Microsoft Security DevOps action is currently in beta and runs on the `windows-latest` queue, as well as Windows self hosted agents. `ubuntu-latest` support coming soon.

# Usage

See [action.yml](action.yml)

## Basic

Run Microsoft Security DevOps (MSDO) with the default policy and recommended tools.

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-dotnet@v1
  with:
    dotnet-version: '3.1.201'
- name: Run Microsoft Security DevOps
  uses: microsoft/security-devops-action@main
  id: msdo
- name: Upload results to Security tab
  uses: github/codeql-action/upload-sarif@v1
  with:
    sarif_file: ${{ steps.msdo.outputs.sarifFile }}
```

## Upload Results to the Security tab

To upload results to the Security tab of your repo, run the `github/codeql-action/upload-sarif` action immediately after running MSDO. MSDO sets the action output variable `sarifFile` to the path of a single SARIF file that can be uploaded to this API.

```yaml
- name: Upload results to Security tab
  uses: github/codeql-action/upload-sarif@v1
  with:
    sarif_file: ${{ steps.msdo.outputs.sarifFile }}
```

# Open Source Tools

| Name | Language |
| --- | --- |
| [Bandit](https://github.com/PyCQA/bandit) | python |
| [BinSkim](https://github.com/Microsoft/binskim) | binary - Windows, ELF |
| [ESlint](https://github.com/eslint/eslint) | JavaScript |
| [Template Analyzer](https://github.com/Azure/template-analyzer) | Infrastructure-as-code (IaC), ARM templates |
| [Terrascan] | |
| [Trivy](https://github.com/aquasecurity/trivy) | container images, file systems, and git repositories |

# More Information

Please see the [wiki tab](https://github.com/microsoft/security-devops-action/wiki) for more information and the [Frequently Asked Questions (FAQ)](https://github.com/microsoft/security-devops-action/wiki/FAQ) page.

# Report Issues

Please [file a GitHub issue](https://github.com/microsoft/security-devops-action/issues/new) in this repo. To help us investigate the issue, please include a description of the problem, a link to your workflow run (if public), and/or logs from the MSDO action's output.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributing

Contributions are welcome! See the [Contributor's Guide](docs/contributors.md).
