resource "azurerm_resource_group" "mappingresourcegroup" {
  name = "MappingExample"
  location = "Central US"
}

resource "azurerm_storage_account" "mappingstorageaccount" {
  name                     = "iacmapping"
  resource_group_name      = azurerm_resource_group.mappingresourcegroup.name
  location                 = azurerm_resource_group.mappingresourcegroup.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  enable_https_traffic_only = true
  sftp_enabled = false
  public_network_access_enabled = false

  tags = {
    "mapping_tag" = "ae29b8c9-da7d-465e-b5c4-d6fb80ea22cc"
  }
}
