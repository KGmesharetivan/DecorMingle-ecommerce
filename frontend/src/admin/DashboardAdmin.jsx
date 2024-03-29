import React, { useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";

import "../styles/dashboard.css";

import { Container, Row, Col } from "reactstrap";

import useGetData from "../custom-hooks/useGetData";

const DashboardAdmin = () => {
  const { data: products } = useGetData("products");
  const { data: users } = useGetData("users");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: orders } = useGetData("orders");

  // Calculate total sales amount
  const totalSalesAmount = orders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );

  // Calculate total number of orders
  const totalOrders = orders.length;

  // Calculate total returns
  // Assuming returns are represented by orders with negative total amounts
  const totalReturns = orders.reduce(
    (total, order) =>
      order.totalAmount < 0 ? total + order.totalAmount : total,
    0
  );

  return (
    <>
      <Helmet title="Dashboard">
        <CommonSection title="Dashboard" />
        <section>
          <Container>
            <Row className="dashboard-admin">
              <Col className="lg-3">
                <div className="revenue__box-admin">
                  <h5>Total Sales Amount:</h5>
                  <span>₱{totalSalesAmount}</span>
                </div>
              </Col>
              <Col className="lg-3">
                <div className="order__box-admin">
                  <h5>Total Orders:</h5>
                  <span>{totalOrders}</span>
                </div>
              </Col>
              <Col className="lg-3">
                <div className="products__return-admin">
                  <h5>Total Returns:</h5>
                  <span>{totalReturns}</span>
                </div>
              </Col>
              <Col className="lg-3">
                <div className="products__box-admin">
                  <h5>Total Products:</h5>
                  <span>{products.length}</span>
                </div>
              </Col>
              <Col className="lg-3">
                <div className="users__box-admin">
                  <h5>Total Users:</h5>
                  <span>{users.length}</span>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </Helmet>
    </>
  );
};

export default DashboardAdmin;
