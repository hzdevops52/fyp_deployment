#!/bin/bash

HOST_IP=$(hostname -I | awk '{print $1}')
FRONTEND_PORT=6060
BACKEND_PORT=32231

echo "🚀 Starting PDF Notes Hub..."
echo "📡 Host IP: $HOST_IP"

# Fix kubectl context
minikube update-context

# Kill existing port forwards
pkill -f "kubectl port-forward" 2>/dev/null
sleep 2

# Recreate Groq secret (from local file - no internet needed)
GROQ_KEY=$(cat ~/.groq_api_key)
kubectl delete secret groq-secret 2>/dev/null
kubectl create secret generic groq-secret \
  --from-literal=api-key=$GROQ_KEY

# Restart CoreDNS and backend
echo "⏳ Restarting CoreDNS..."
kubectl rollout restart deployment coredns -n kube-system
sleep 15

echo "🔄 Restarting backend..."
kubectl rollout restart deployment backend
sleep 20

echo "✅ All pods ready!"
kubectl get pods

# Forward ports (localhost approach - works on ANY network)
kubectl port-forward --address 0.0.0.0 svc/frontend $FRONTEND_PORT:80 &
kubectl port-forward --address 0.0.0.0 svc/backend $BACKEND_PORT:5000 &

echo ""
echo "🌐 Open on THIS laptop: http://localhost:$FRONTEND_PORT"
echo "🌐 Open on other devices: http://$HOST_IP:$FRONTEND_PORT"
echo "📡 Backend: http://localhost:$BACKEND_PORT"
echo ""
echo "Press Ctrl+C to stop..."

trap "kill %1 %2" EXIT
wait