## Introduction

This folder provides samples for using the Infrastructure as Code mapping feature within DevOps security in Microsoft Defender for Cloud. 

## Contents
* [main.tf](main.tf) provisions an Azure Storage account through Terraform with a unique mapping_tag. To use this template, ensure you modify the locations, names, and unique GUID. To generate a GUID, use [this website](https://guidgenerator.com/)
* [azure-pipeline.yml](azure-pipeline.yml) is a sample Azure DevOps pipeline that can be used to provision the Terraform code in main.tf as a resource within Azure.
* [github-workflow.yml](github-workflow.yml) is a sample GitHub workflow that can be used to provision the Terraform code in main.tf as a resource within Azure.

