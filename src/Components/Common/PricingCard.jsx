import React from "react";
import ButtonDark from "./ButtonDark";

const PricingCard = (props) => {
  console.log(props.plan.Items);
  return (
    <div className="pricingPlanCard">
      <div className="pricingPlanContainer">
        <div className="pricingPlanHeading">{props.plan.Heading}</div>
        <div className="pricingPlanCost">{props.plan.Cost}</div>
        <div className="pricingPlanLine"></div>
        <div className="pricingPlanSubHeadding">Includes:</div>
        {props.plan.Items.map((element) => {
          return (
            <div className="pricingPlanItem">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/3312b4e0-1bcc-4a7f-adb7-560bc5c2383b?apiKey=05a03f3237de41d99e4f93550adfb278&"
                className="pricingPlanItemImg"
              />
              <div className="priicngPlanItemText">{element}</div>
            </div>
          );
        })}
        <div
          style={{
            alignSelf: "stretch",
            textAlign: "center",
            marginTop: "24px",
          }}
        >
          <ButtonDark text="Subcribe" />
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
