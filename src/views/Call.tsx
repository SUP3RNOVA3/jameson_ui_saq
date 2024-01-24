import { useContext, useEffect, useRef, useState } from "react";
import "@vonage/video-publisher/video-publisher.js";
import "@vonage/video-subscribers/video-subscribers.js";

import { useMqttState, useSubscription } from "~/@mqtt-react-hooks";
import { AppContext, IVideoInfo } from "~/components/AppContext";

import { MQTT_TOPICS, API_KEY } from "~/lib/constants";
import { useNavigate } from "react-router-dom";
import useTimer from "~/components/useTimer";

declare global {
  interface Window {
    OT: any;
  }
}

const Call = () => {
  const { boothInfo, videoInfo } = useContext(AppContext);
  const { client } = useMqttState();
  const navigate = useNavigate();

  const sessionRef = useRef<any>(null);

  const { countdown, countdownHHMM, startTimer, resetTimer } = useTimer(60 * 1);

  const { message: payload } = useSubscription([MQTT_TOPICS.CALL_END]);

  useEffect(() => {
    onPayloadRecieved(payload);
  }, [payload]);

  const onPayloadRecieved = (payload: any) => {
    console.log("payload recieved", payload);

    if (!payload) return;

    const { topic, message } = payload;

    if (topic === MQTT_TOPICS.CALL_END) {
      onCALL_END(message);
    }
  };

  const onCALL_END = (message: IVideoInfo) => {
    console.log("onCALL_END", message);

    if (
      message.status === "ended" &&
      message.incomming_sessionId === videoInfo.incomming_sessionId &&
      videoInfo.endedBy !== boothInfo?.mac
    ) {
      closeCall(true);
    }
  };

  useEffect(() => {
    if (countdown === 0) {
      closeCall();
    }
  }, [countdown]);

  const closeCall = (forceEnd = false) => {
    if (!forceEnd) {
      client?.publish(
        MQTT_TOPICS.CALL_END,
        JSON.stringify({
          ...videoInfo,
          status: "ended",
          endedBy: boothInfo?.mac,
        })
      );
    }

    if (sessionRef.current) {
      sessionRef.current.disconnect();
    }

    navigate("/thankyou");
  };

  useEffect(() => {
    if (videoInfo.status === "idle") {
      navigate("/");
    }

    if (boothInfo?.role === "publisher") {
      const { sessionId, token } = videoInfo;
      initializeSession(sessionId, token);
    }

    if (boothInfo?.role === "subscriber") {
      const { incomming_sessionId, incomming_token } = videoInfo;
      initializeSession(incomming_sessionId, incomming_token);
    }
  }, []);

  useEffect(() => {
    if (videoInfo.status !== "connected") {
      client?.publish(
        MQTT_TOPICS.CALL_CONNECTED,
        JSON.stringify({ ...videoInfo, status: "connected" })
      );
    }
  }, [videoInfo.status]);

  const handleError = (error: any) => {
    if (error) {
      console.error(error);
    }
  };

  const initializeSession = (sessionId: string, token: string) => {
    const OT = window.OT;
    const session = OT.initSession(API_KEY, sessionId);
    sessionRef.current = session;

    session.on("streamCreated", function (event: any) {
      session.subscribe(event.stream, "subscriber", {
        insertMode: "append",
        width: "100%",
        height: "100%",
      }, handleError);
      startTimer();
    });

    const publisher = OT.initPublisher("publisher", {
      insertMode: "append",
      width: "100%",
      height: "100%",
    }, handleError);

    session.connect(token, function (error: any) {
      if (error) {
        handleError(error);
      } else {
        session.publish(publisher, handleError);
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div id="videos" className="w-full h-full text-8xl relative mt-4">
        <div id="subscriber" className="w-full h-full"></div>
        <div id="publisher" className="h-64 w-64 absolute bottom-6 left-6"></div>
        <div className="text-3xl p-4 absolute top-6 right-6 rounded-lg bg-gray-800">
          Timer: {countdownHHMM}
        </div>
        <button
          type="button"
          onClick={() => closeCall()}
          className="text-2xl py-6 absolute bottom-4 right-4 bg-red-800 bg-opacity-50 w-20 h-20 rounded-full text-center"
        >
          End
        </button>
        {countdown < 5 && (
          <div className="text-2xl p-4 absolute bottom-6 left-6 rounded-lg bg-gray-800 bg-opacity-50 w-2/5 text-left">
            Congratulations, your circle of friends is wider. Check your
            email for your free drink.
          </div>
        )}
      </div>
    </div>
  );
};

export default Call;
