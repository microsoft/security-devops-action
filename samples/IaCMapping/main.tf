terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"  # adjust this as per your requirements
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "resourcegroup" {
  name = "iacmappingdemo"
  location = "Central US"
}

resource "azurerm_storage_account" "terraformaccount1" {
  name                     = "iacmapping1212"
  resource_group_name      = azurerm_resource_group.resourcegroup.name
  location                 = "Central US"
  account_tier             = "Standard"
  account_replication_type = "GRS"

  tags = {
    "mapping_tag" = "6189b638-15a5-42ec-b934-0d2b8e035ce1"
  }
}
