echo "正在重启Azure以更换IP地址..."
vm_group=$(cat config.json | jq -r .az_group)
vm_name=$(cat config.json | jq -r .az_name)
az vm deallocate -g $vm_group -n $vm_name
az vm start -g $vm_group -n $vm_name
