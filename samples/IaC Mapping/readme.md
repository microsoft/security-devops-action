## Introduction

This folder provides samples for using [Infrastructure as Code mapping](https://learn.microsoft.com/azure/defender-for-cloud/iac-template-mapping) within DevOps security in Microsoft Defender for Cloud. 

This deployment should only be performed in non-production subscriptions with **no other Terraform managed resources**. 

Note that we do not choose a backend location to store the state file in this demo. Terraform utilizes a state file to store information about the current state of your managed infrastructure and associated configuration. This file will need to be persisted between different runs of the workflow. The recommended approach is to store this file within an Azure Storage Account or other similar remote backend. Normally, this storage would be provisioned manually or via a separate workflow. The Terraform backend block will need updated with your selected storage location (see here for documentation). To learn how to incorporate this, see [here](https://developer.hashicorp.com/terraform/language/settings/backends/azurerm). 

## Contents
* [main.tf](main.tf) provisions an Azure Storage account through Terraform with a unique mapping_tag. To use this template, ensure you modify the locations, names, and unique GUID. To generate a GUID, use [this website](https://guidgenerator.com/).
* [azure-pipeline.yml](azure-pipeline.yml) is a sample Azure DevOps pipeline that can be used to provision the Terraform code in main.tf as a resource within Azure.
  * Requires [Azure Resource Manager service connection](https://learn.microsoft.com/en-us/troubleshoot/azure/devops/overview-of-azure-resource-manager-service-connections#create-an-azure-rm-service-connection) with permissions to an Azure subscription.
* [github-workflow.yml](github-workflow.yml) is a sample GitHub workflow that can be used to provision the Terraform code in main.tf as a resource within Azure.
  * Requires [Microsoft Entra application for authentication](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-portal%2Clinux#use-the-azure-login-action-with-openid-connect). 
  * Requires GitHub Secrets to be added to repository and the environment.
    * Repository - For guidance, see [here](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-encrypted-secrets-for-a-repository)
      * AZURE_CLIENT_ID : The application (client) ID of the app registration in Azure
      * AZURE_TENANT_ID : The tenant ID of Entra ID where the app registration is defined.
      * AZURE_SUBSCRIPTION_ID : The subscription ID where the app registration is defined.
    * Environment - For guidance, see [here](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-encrypted-secrets-for-an-environment)
      * AZURE_CLIENT_ID : The application (client) ID of the app registration in Azure
