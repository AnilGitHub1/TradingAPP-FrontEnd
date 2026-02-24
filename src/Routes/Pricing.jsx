import React from "react";
import ButtonDark from "../Components/Common/ButtonDark";
import ButtonLight from "../Components/Common/ButtonLight";
import PricingCard from "../Components/Common/PricingCard";
import { basicPlan, bussinessPlan } from "../Constants/constants";

const Pricing = () => {
  return (
    <div className="pricingContainer">
      <div className="pricingSection">
        <div className="pricingAffordable">Affordable</div>
        <div className="pricingPlans">Pricing Plans</div>
        <div className="pricingText">
          Choose the perfect plan that suits your needs
        </div>
        <div className="pricingButtons">
          <ButtonDark text="Monthly" />
          <ButtonLight text="Yearly" />
        </div>
        <div className="pricingCards">
          <div className="pricingCardsContainer">
            <PricingCard plan={basicPlan} />
            <PricingCard plan={bussinessPlan} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
