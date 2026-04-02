import QuestionForm from "../../../components/QuestionForm";
import React from "react";

const Page = () => {
  return (
    <div className="block pt-32 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="mt-4 mb-10 text-2xl">Ask a public question</h1>

        <div className="flex flex-wrap md:flex-row-reverse">
          <div className="w-full md:w-1/3"></div>
          <div className="w-full md:w-2/3">
            <QuestionForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
