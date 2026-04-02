import { QuestionDetailSkeleton } from "../../../../components/ui/Skeleton";
import Particles from "../../../../components/magicui/particles";

export default function Loading() {
  return (
    <div className="container pl-6">
      <Particles
        className="fixed inset-0 h-full w-full"
        quantity={500}
        ease={100}
        color="#ffffff"
        refresh
      />
      <div className="relative mx-auto max-w-4xl px-4 pt-36 pb-20">
        <QuestionDetailSkeleton />
      </div>
    </div>
  );
}
