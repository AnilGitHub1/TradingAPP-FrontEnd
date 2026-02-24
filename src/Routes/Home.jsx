import React from "react";
import "../App.css";
import ButtonDark from "../Components/Common/ButtonDark";
import ButtonLight from "../Components/Common/ButtonLight";
import Footer from "../Components/Layout/Footer";
import HeroHeader from "../Components/HeroHeader";
import CallToAction from "../Components/Common/CallToAction";
import StockNews from "../Features/Stocks/StockNews";
import Testimonial from "../Components/Testimonial";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="main">
      <HeroHeader />
      <div className="div-23">
        <div className="div-24">
          <div className="div-25">
            <div className="column">
              <img loading="lazy" src="./Images/4.jpg" className="img-8" />
            </div>
            <div className="column-2">
              <div className="div-26">
                <div className="div-27">Revolutionize Your Trading Experience</div>
                <div className="div-28">
                  Empower Your Trading Journey with our Real-Time Stock
                  Insights, Customizable Charts, Intelligent Trendlines, Chart
                  Patterns, Candlestick patterns, Systematic Algo Trading and
                  many more exciting features
                  <br />– Your Gateway to Informed Decision-Making.
                </div>
                <div className="div-29">
                  <div onClick={() => navigate("/learnmore")}>
                    <ButtonLight text="Learn More" />
                  </div>
                  <div onClick={() => navigate("/signup")}>
                    <ButtonDark text="Sign Up" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="div-32">
        <div className="div-33">
          <div className="div-34">
            <div className="column">
              <div className="div-35">
                <div className="div-37">Systematic Trading Redefined</div>
                <div className="div-38">
                  Superior Trendlines using Operations Research Excellence.
                  Embrace Systematic Breakout Trading Strategies with a
                  Pre-Defined Trade Executor. Revolutionizing Trader Psychology
                  and Empowering Traders with Confidence and Control.
                </div>
                <div className="div-39">
                  <div className="div-40">
                    <div className="column">
                      <div className="div-41">
                        <div className="div-42">Algo Trendlines</div>
                        <div className="div-43">
                          Better your trading journey with our system generated
                          Super-Trendlines.
                        </div>
                      </div>
                    </div>
                    <div className="column-3">
                      <div className="div-44">
                        <div className="div-45">Predefined Trades</div>
                        <div className="div-46">
                          Elevating trading psychology, our unique one-of-a-kind
                          predefined trade executor sets a new industry
                          standard.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="div-47">
                  <div onClick={() => navigate("/learnmore")}>
                    <ButtonLight text="Learn More" />
                  </div>
                  <div onClick={() => navigate("/signup")}>
                    <ButtonDark text="Sign Up" />
                  </div>
                </div>
              </div>
            </div>
            <div className="column-4">
              <img loading="lazy" src="./Images/5.jpg" className="img-9" />
            </div>
          </div>
        </div>
      </div>
      <CallToAction />
      <Testimonial />
      <StockNews />
      <Footer />
    </div>
  );
}
