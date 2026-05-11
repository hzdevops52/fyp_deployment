#!/bin/bash

HOST_IP=$(hostname -I | awk '{print $1}')
BACKEND_PORT=32231
FRONTEND_PORT=6060
IP_FILE=~/.fyp_last_ip

echo "🚀 Starting PDF Notes Hub..."
echo "📡 Current IP: $HOST_IP"

# Fix kubectl context
minikube update-context

# Kill existing port forwards
pkill -f "kubectl port-forward" 2>/dev/null
sleep 2

# Restart CoreDNS and backend
kubectl rollout restart deployment coredns -n kube-system
sleep 10
kubectl rollout restart deployment backend
sleep 15

# Only rebuild frontend if IP changed
LAST_IP=$(cat $IP_FILE 2>/dev/null)

if [ "$HOST_IP" != "$LAST_IP" ]; then
  echo "🔨 IP changed! Rebuilding frontend..."
  
  docker build \
    --network=host \
    --build-arg REACT_APP_API_URL=http://$HOST_IP:$BACKEND_PORT \
    -t hzdevops52/frontend:latest \
    ~/fyp_project/frontend

  docker push hzdevops52/frontend:latest
  kubectl set image deployment/frontend frontend=hzdevops52/frontend:latest
  kubectl rollout restart deployment frontend
  sleep 20

  # Save new IP
  echo $HOST_IP > $IP_FILE
  echo "✅ Frontend rebuilt with new IP!"
else
  echo "✅ IP unchanged — skipping rebuild!"
fi

echo "✅ All pods ready!"
kubectl get pods

# Forward ports
kubectl port-forward --address 0.0.0.0 svc/frontend $FRONTEND_PORT:80 &
kubectl port-forward --address 0.0.0.0 svc/backend $BACKEND_PORT:5000 &

echo ""
echo "🌐 Open on any device: http://$HOST_IP:$FRONTEND_PORT"
echo "📡 Backend: http://$HOST_IP:$BACKEND_PORT"
echo ""
echo "Press Ctrl+C to stop..."

trap "kill %1 %2" EXIT
wait
