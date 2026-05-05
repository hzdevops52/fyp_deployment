#!/bin/bash

HOST_IP=$(hostname -I | awk '{print $1}')

echo "🚀 Starting PDF Notes Hub..."
echo "📡 Your WiFi IP: $HOST_IP"

# Wait for CoreDNS to be ready
echo "⏳ Waiting for CoreDNS to be ready..."
kubectl wait --for=condition=ready pod -l k8s-app=kube-dns -n kube-system --timeout=120s

# Restart backend to ensure DNS is picked up fresh
echo "🔄 Restarting backend..."
kubectl rollout restart deployment backend
kubectl wait --for=condition=ready pod -l app=backend --timeout=120s

# Restart frontend if not running
kubectl rollout restart deployment frontend
kubectl wait --for=condition=ready pod -l app=frontend --timeout=120s

echo ""
echo "✅ All pods ready!"
kubectl get pods

# Forward frontend
kubectl port-forward --address 0.0.0.0 svc/frontend 7070:80 &

# Forward backend
kubectl port-forward --address 0.0.0.0 svc/backend 32231:5000 &

echo ""
echo "🌐 Open on any device: http://$HOST_IP:7070"
echo "📡 Backend running at: http://$HOST_IP:32231"
echo ""
echo "Press Ctrl+C to stop..."

trap "kill $(jobs -p)" EXIT
wait