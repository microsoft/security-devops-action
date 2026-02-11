# Wiki Context for Issue Triage Assistant

## Home

**Microsoft Security DevOps (MSDO)** is a command line application which integrates static analysis tools into the development cycle. MSDO installs, configures and runs the latest versions of static analysis tools (including, but not limited to, SDL/security and compliance tools). MSDO is data-driven with portable configurations that enable deterministic execution across multiple environments. For tools that output results in or MSDO can convert their results to [SARIF](https://github.com/sarif-standard), MSDO imports into a normalized file database for seamlessly reporting and responding to results across tools, such as forcing build breaks.

Note: This page describes how to configure the MSDO Action for GitHub workflows. For Azure DevOps task configuration, please see [here](https://github.com/microsoft/security-devops-azdevops/wiki).

# How to Configure the Microsoft Security DevOps (MSDO) Action

<h2>MSDO Action Configuration</h2>

```yaml
steps:
 - name: Run Microsoft Security DevOps
   uses: microsoft/security-devops-action@latest
   id: msdo
 # with:
   # config: string. Optional. A file path to an MSDO configuration file ('*.gdnconfig'). See 'Tool Options' for additional configuration instructions.
   # policy: 'GitHub' | 'microsoft' | 'none'. Optional. The name of a well-known Microsoft policy to determine which tools/checks to run. If no configuration file or list of tools is provided, the policy may instruct MSDO which tools to run. Default: GitHub.
   # categories: string. Optional. A comma-separated list of analyzer categories to run. Values: 'code', 'artifacts', 'IaC', 'containers'. Example: 'IaC, containers'. Defaults to all.   
   # languages: string. Optional. A comma-separated list of languages to analyze. Example: 'javascript,typescript'. Defaults to all.
   # tools: string. Optional. A comma-separated list of analyzer tools to run. Values: 'antimalware' (Windows only), 'bandit', 'binskim', 'checkov', 'eslint', 'templateanalyzer', 'terrascan', 'trivy'.
 # env:
   # environment variable configurations. Optional.
```

### Action Environment Variables


| Argument name | Environment variable name | Description |
| --- | --- | --- |
| --auto | GDN_RUN_AUTO | Automatically detect what tools are applicable and then included. |
| --blame | GDN_RUN_BLAME | Retrieve the git blame data for each security finding identified by MSDO to trace the issue to the origin. Default is false. |
| --config | GDN_RUN_CONFIG | A path to a MSDO run config file that points to the tools and command line options to run. Any number of space-delimited configs may be specified. |
| --tool | GDN_RUN_TOOL | The name of a MSDO tool or the path to a tool configuration file to run an analysis tool. The run config info will be generated using the tool configuration's required inputs defaults. Any number of space-delimited tools may be specified. |
| --analyze-fast | GDN_RUN_ANALYZEFAST | (Optional) Fail the entire job after one analyzer failure and do not continue 
## FAQ

## How does MSDO determine what tools to run?

Each tool integrated into MSDO comes with a file-based applicability filter. When MSDO sees files that match the applicability filter, the tool will automatically be installed and ran. For instance, if you have ARM Template files in your repository, [Template Analyzer](https://github.com/Azure/template-analyzer) will run.

## How can I get support?

Please [file a GitHub issue](https://github.com/microsoft/security-devops-action/issues/new) in this repo. To help us investigate the issue, please include a description of the problem, a link to your workflow run (if public), and/or logs from the MSDO's action output.

## Can I recommend an Open Source Software (OSS) tool to run?

YES. MSDO is a configuration-driven tool execution engine. Please [file a GitHub issue](https://github.com/microsoft/security-devops-action/issues/new) in this repo requesting the tool be on onboarded. Your request helps us prioritize customer demand.
