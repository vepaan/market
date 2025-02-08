from django.urls import path
from . import views

urlpatterns = [
    path("stock-data", views.get_stock_data, name="get_stock_data"),
    path("company-name", views.get_company_name, name="get_company_name"),
    path("valid-ticker", views.isvalid, name="isvalid"),
    path("bid-ask", views.get_bid_ask, name="get_bid_ask"),
    path("simulate-price-5s", views.simulate_5s_chart, name="simulate_5s_chart"),
]
